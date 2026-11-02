from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.base import AssetInspectionResponse
from app.services.asset_checker import inspect_image_asset

router = APIRouter(tags=["assets"])


@router.post(
    "/brands/{brand_id}/assets/inspect-image",
    response_model=AssetInspectionResponse,
    summary="Inspect visual marketing asset for text and brand compliance",
)
async def inspect_asset_image_endpoint(
    brand_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        file_bytes = await file.read()
        filename = file.filename or "unknown_asset.png"
        content_type = file.content_type

        result = inspect_image_asset(
            db=db,
            brand_id=brand_id,
            filename=filename,
            file_bytes=file_bytes,
            content_type=content_type,
        )
        return result
    except ValueError as e:
        msg = str(e)
        if "not found" in msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=msg,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Asset inspection encountered an unexpected error: {str(e)}",
        )

