"use client";

export const dynamic = "force-dynamic";

import { Search, Shield, ShieldCheck, UserRound, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import MockAppShell, { cardClass, sectionTitleClass } from "@/components/mock-app-shell";
import { AuthGuard } from "@/components/AuthGuard";
import { can } from "@/lib/roles";
import type { AppRole } from "@/lib/roles";
import { usePlatformRole } from "@/hooks/useUserRole";
import { listPlatformUsers } from "@/lib/services/admin/list-users";
import { updateUserAppRole } from "@/lib/services/admin/update-user-role";
import type { PlatformUser } from "@/lib/services/admin/admin-types";

const PAGE_SIZE = 15;

function RoleBadge({ role }: { role: string }) {
  const isSuperAdmin = role === "super_admin";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isSuperAdmin
          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
          : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-secondary)]"
      }`}
    >
      {isSuperAdmin ? <ShieldCheck className="h-3 w-3" /> : null}
      {isSuperAdmin ? "Super Admin" : "User"}
    </span>
  );
}

function UserRow({
  user,
  onToggleRole,
  isUpdating,
}: {
  user: PlatformUser;
  onToggleRole: (userId: string, newRole: AppRole) => void;
  isUpdating: boolean;
}) {
  const isSuperAdmin = user.appRole === "super_admin";
  const newRole: AppRole = isSuperAdmin ? "user" : "super_admin";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-4 py-3 transition hover:border-[var(--ud-border)]">
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#0C5C57] to-[#1a8a82]">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <UserRound className="h-5 w-5 text-white/80" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--ud-text-primary)]">
          {user.fullName || "Unnamed User"}
        </p>
        <p className="truncate text-xs text-[var(--ud-text-muted)]">{user.email || "No email"}</p>
      </div>

      {/* Role badge */}
      <RoleBadge role={user.appRole} />

      {/* Toggle button */}
      <button
        type="button"
        disabled={isUpdating}
        onClick={() => onToggleRole(user.id, newRole)}
        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          isSuperAdmin
            ? "border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/20"
            : "border border-[var(--ud-border)] text-[var(--ud-brand-primary)] hover:bg-[var(--ud-brand-light)]"
        } ${isUpdating ? "cursor-not-allowed opacity-50" : ""}`}
      >
        {isUpdating ? "..." : isSuperAdmin ? "Demote" : "Promote"}
      </button>
    </div>
  );
}

function AdminPanelContent() {
  const { role: platformRole, isLoading: roleLoading } = usePlatformRole();
  const canAccess = can(platformRole, "page:admin_panel");

  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    userName: string;
    newRole: AppRole;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const result = await listPlatformUsers({
      search: search || undefined,
      roleFilter,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });
    setUsers(result.users);
    setTotal(result.total);
    setIsLoading(false);
  }, [search, roleFilter, page]);

  useEffect(() => {
    if (canAccess) fetchUsers();
  }, [canAccess, fetchUsers]);

  const handleToggleRole = (userId: string, newRole: AppRole) => {
    const user = users.find((u) => u.id === userId);
    setConfirmAction({
      userId,
      userName: user?.fullName || user?.email || userId,
      newRole,
    });
  };

  const confirmRoleChange = async () => {
    if (!confirmAction) return;
    setUpdatingId(confirmAction.userId);
    setConfirmAction(null);

    const result = await updateUserAppRole(confirmAction.userId, confirmAction.newRole);
    if (result.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === confirmAction.userId ? { ...u, appRole: confirmAction.newRole } : u
        )
      );
    }
    setUpdatingId(null);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const superAdminCount = users.filter((u) => u.appRole === "super_admin").length;

  if (roleLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ud-brand-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <Shield className="h-12 w-12 text-[var(--ud-text-muted)]" />
        <h2 className="mt-4 text-xl font-semibold text-[var(--ud-text-primary)]">Access Denied</h2>
        <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
          Only super admins can access the admin panel.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="mb-4">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-[var(--ud-brand-primary)]" />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--ud-text-primary)]">
              Admin Panel
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ud-text-secondary)]">
              Manage platform users and assign super admin privileges.
            </p>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className={cardClass("p-4 text-center")}>
          <p className="text-2xl font-bold text-[var(--ud-text-primary)]">{total}</p>
          <p className="text-xs text-[var(--ud-text-muted)]">Total Users</p>
        </div>
        <div className={cardClass("p-4 text-center")}>
          <p className="text-2xl font-bold text-amber-600">{superAdminCount}</p>
          <p className="text-xs text-[var(--ud-text-muted)]">Super Admins</p>
        </div>
        <div className={cardClass("hidden p-4 text-center sm:block")}>
          <p className="text-2xl font-bold text-[var(--ud-text-primary)]">{total - superAdminCount}</p>
          <p className="text-xs text-[var(--ud-text-muted)]">Regular Users</p>
        </div>
      </div>

      {/* Search + filter */}
      <section className={cardClass("p-5 sm:p-6")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-4 py-2.5">
            <Search className="h-4 w-4 text-[var(--ud-text-muted)]" strokeWidth={1.8} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name or email..."
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ud-text-secondary)] outline-none"
            />
          </div>
          <div className="flex gap-2">
            {["all", "super_admin", "user"].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setRoleFilter(filter);
                  setPage(0);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  roleFilter === filter
                    ? "bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]"
                    : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]"
                }`}
              >
                {filter === "all" ? "All" : filter === "super_admin" ? "Super Admin" : "User"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* User list */}
      <section className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className={sectionTitleClass()}>Users</h2>
          <p className="text-sm text-[var(--ud-text-muted)]">
            {total} user{total !== 1 ? "s" : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--ud-brand-primary)] border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className={cardClass("p-8 text-center")}>
            <p className="text-sm text-[var(--ud-text-secondary)]">No users found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onToggleRole={handleToggleRole}
                isUpdating={updatingId === user.id}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-[var(--ud-border)] p-2 text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-[var(--ud-text-secondary)]">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-lg border border-[var(--ud-border)] p-2 text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </section>

      {/* Confirmation modal */}
      {confirmAction ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--ud-bg-card)] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--ud-text-primary)]">Confirm Role Change</h3>
            <p className="mt-3 text-sm text-[var(--ud-text-secondary)]">
              {confirmAction.newRole === "super_admin"
                ? `Promote "${confirmAction.userName}" to Super Admin? They'll get full platform access.`
                : `Demote "${confirmAction.userName}" to regular user? They'll lose admin privileges.`}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-xl border border-[var(--ud-border)] py-2.5 text-sm font-semibold text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRoleChange}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition ${
                  confirmAction.newRole === "super_admin"
                    ? "bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] hover:opacity-90"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {confirmAction.newRole === "super_admin" ? "Promote" : "Demote"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard>
      <MockAppShell activeNav="home">
        <AdminPanelContent />
      </MockAppShell>
    </AuthGuard>
  );
}
