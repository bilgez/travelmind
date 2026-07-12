from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    activity_ids = Column(JSON, nullable=False)  # [1, 3, 5, 7] — aktivite ID'leri sırasıyla
    total_distance = Column(Float, nullable=True)  # km
    total_duration = Column(Float, nullable=True)  # saat
    total_cost_estimate = Column(Float, nullable=True)  # TL
    optimized_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="routes")
