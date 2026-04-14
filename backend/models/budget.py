from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False, unique=True)
    activity_cost_sum = Column(Float, default=0.0)  # Seçilen aktivitelerin toplam fiyatı
    transport_cost = Column(Float, default=0.0)     # Taşıma maliyeti tahmin (km × benzin)
    contingency = Column(Float, default=0.0)        # Beklenmedik masraflar (% olarak)
    total_estimate = Column(Float, default=0.0)     # Toplam bütçe tahmini
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    trip = relationship("Trip", back_populates="budget")
