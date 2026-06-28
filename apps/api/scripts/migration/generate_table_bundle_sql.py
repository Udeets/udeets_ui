from __future__ import annotations

import argparse
from pathlib import Path

import psycopg
from common import ROOT, ensure_dir, require_env


def quote_ident(name: str) -> str:
    escaped = name.replace('"', '""')
    return f'"{escaped}"'


def fetch_columns(conn: psycopg.Connection, table: str) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """
            select
              a.attname as column_name,
              pg_catalog.format_type(a.atttypid, a.atttypmod) as type_sql,
              a.attnotnull as not_null,
              pg_get_expr(ad.adbin, ad.adrelid) as default_expr
            from pg_attribute a
            join pg_class c on c.oid = a.attrelid
            join pg_namespace n on n.oid = c.relnamespace
            left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
            where n.nspname='public'
              and c.relname=%s
              and a.attnum > 0
              and not a.attisdropped
            order by a.attnum
            """,
            (table,),
        )
        rows = cur.fetchall()
    return [
        {
            "column_name": str(row[0]),
            "type_sql": str(row[1]),
            "not_null": bool(row[2]),
            "default_expr": str(row[3]) if row[3] is not None else None,
        }
        for row in rows
    ]


def fetch_constraints(conn: psycopg.Connection, table: str) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """
            select
              con.conname as constraint_name,
              con.contype as constraint_type,
              pg_get_constraintdef(con.oid, true) as constraint_def
            from pg_constraint con
            join pg_class rel on rel.oid = con.conrelid
            join pg_namespace nsp on nsp.oid = rel.relnamespace
            where nsp.nspname='public'
              and rel.relname=%s
              and con.contype in ('p','u','f','c')
            order by
              case
                when con.contype = 'p' then 1
                when con.contype = 'u' then 2
                when con.contype = 'c' then 3
                when con.contype = 'f' then 4
                else 5
              end,
              con.conname
            """,
            (table,),
        )
        rows = cur.fetchall()
    constraints = [
        {
            "constraint_name": str(row[0]),
            "constraint_type": str(row[1]),
            "constraint_def": str(row[2]),
        }
        for row in rows
    ]
    filtered: list[dict] = []
    for constraint in constraints:
        definition = constraint["constraint_def"].lower()
        # Skip Supabase platform references not available in plain RDS.
        if "references auth." in definition or "references storage." in definition:
            continue
        filtered.append(constraint)
    return filtered


def render_create_table(table: str, columns: list[dict]) -> str:
    lines = [f"create table if not exists public.{quote_ident(table)} ("]
    for idx, column in enumerate(columns):
        suffix = "," if idx < len(columns) - 1 else ""
        line = f"  {quote_ident(column['column_name'])} {column['type_sql']}"
        default_expr = str(column["default_expr"] or "")
        lower_default = default_expr.lower()
        # Supabase-only defaults (e.g. auth.uid()) are not portable to plain RDS.
        if default_expr and "auth." not in lower_default:
            line += f" default {default_expr}"
        if column["not_null"]:
            line += " not null"
        lines.append(f"{line}{suffix}")
    lines.append(");")
    return "\n".join(lines)


def render_constraint_block(table: str, constraint_name: str, constraint_def: str) -> str:
    escaped_name = constraint_name.replace("'", "''")
    return (
        "do $$\n"
        "begin\n"
        "  if not exists (\n"
        "    select 1\n"
        "    from pg_constraint con\n"
        "    join pg_class rel on rel.oid = con.conrelid\n"
        "    join pg_namespace nsp on nsp.oid = rel.relnamespace\n"
        "    where nsp.nspname = 'public'\n"
        f"      and rel.relname = '{table}'\n"
        f"      and con.conname = '{escaped_name}'\n"
        "  ) then\n"
        f"    alter table public.{quote_ident(table)} "
        f"add constraint {quote_ident(constraint_name)} {constraint_def};\n"
        "  end if;\n"
        "end $$;"
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate SQL bundle (tables + constraints) for selected public tables."
    )
    parser.add_argument("--source-dsn", default=None)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--tables", nargs="+", required=True)
    args = parser.parse_args()

    source_dsn = args.source_dsn or require_env("MIGRATION_SOURCE_DATABASE_URL")
    output_path = Path(args.output_dir)
    output_dir = ROOT / output_path if not output_path.is_absolute() else output_path
    ensure_dir(output_dir)

    with psycopg.connect(source_dsn) as conn:
        table_sql_parts: list[str] = ["-- Generated table DDL bundle"]
        constraint_sql_parts: list[str] = ["-- Generated constraint DDL bundle"]
        pre_fk_blocks: list[str] = []
        fk_blocks: list[str] = []
        for table in args.tables:
            columns = fetch_columns(conn, table)
            if not columns:
                raise RuntimeError(f"Table not found in source: {table}")
            table_sql_parts.append("")
            table_sql_parts.append(render_create_table(table, columns))

            constraints = fetch_constraints(conn, table)
            if constraints:
                table_pre_fk: list[str] = [f"-- {table}"]
                table_fk: list[str] = [f"-- {table}"]
                for constraint in constraints:
                    block = render_constraint_block(
                        table=table,
                        constraint_name=constraint["constraint_name"],
                        constraint_def=constraint["constraint_def"],
                    )
                    if constraint["constraint_type"] == "f":
                        table_fk.append(block)
                    else:
                        table_pre_fk.append(block)
                if len(table_pre_fk) > 1:
                    pre_fk_blocks.append("\n\n".join(table_pre_fk))
                if len(table_fk) > 1:
                    fk_blocks.append("\n\n".join(table_fk))

        if pre_fk_blocks:
            constraint_sql_parts.append("")
            constraint_sql_parts.append("-- Pass 1: PK/UNIQUE/CHECK constraints")
            constraint_sql_parts.append("")
            constraint_sql_parts.append("\n\n".join(pre_fk_blocks))
        if fk_blocks:
            constraint_sql_parts.append("")
            constraint_sql_parts.append("-- Pass 2: FOREIGN KEY constraints")
            constraint_sql_parts.append("")
            constraint_sql_parts.append("\n\n".join(fk_blocks))

    table_file = output_dir / "001_create_tables.sql"
    constraint_file = output_dir / "002_add_constraints.sql"
    table_file.write_text("\n".join(table_sql_parts).strip() + "\n", encoding="utf-8")
    constraint_file.write_text("\n".join(constraint_sql_parts).strip() + "\n", encoding="utf-8")
    print(f"Wrote {table_file}")
    print(f"Wrote {constraint_file}")


if __name__ == "__main__":
    main()
