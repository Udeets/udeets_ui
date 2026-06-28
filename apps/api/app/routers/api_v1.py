from fastapi import APIRouter

from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.chat import router as chat_router
from app.routers.deets import router as deets_router
from app.routers.events import router as events_router
from app.routers.geo import router as geo_router
from app.routers.hubs import router as hubs_router
from app.routers.invitations import router as invitations_router
from app.routers.join_links import router as join_links_router
from app.routers.memberships import router as memberships_router
from app.routers.profiles import router as profiles_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(geo_router)
router.include_router(hubs_router)
router.include_router(memberships_router)
router.include_router(join_links_router)
router.include_router(invitations_router)
router.include_router(chat_router)
router.include_router(events_router)
router.include_router(deets_router)
router.include_router(profiles_router)
router.include_router(admin_router)
