from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # "tarihi_yer", "restoran", "kulup", etc.
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    price = Column(Float, nullable=True)  # TL
    rating = Column(Float, default=4.0)  # 1.0 - 5.0
    city = Column(String, default="Antalya")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
