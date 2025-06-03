from typing import Optional, List, Annotated, Tuple
from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator
from bson import ObjectId

# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.

PyObjectId = Annotated[str, BeforeValidator(str)]
class QueryList(BaseModel):
    """
    Model for possible search queries
    """
    _id: PyObjectId
    query: list[str]
    
class InspectionInfo(BaseModel):
    """
    Model for Inspection Info
    """
    _id: PyObjectId
    query: str
    facilityName: str
    address: str
    rating: str
    date: str
    owner: str
    program: str
    category: str
    status: str
    service: str
    score: float
    grade: str
    violationStatuses: list[str]
    violations: list[str]
    points: list[float]
    
class InspectionsList(BaseModel):
    query: str
    inspections: list[InspectionInfo]

class HeatmapTimeData(BaseModel):
    """
    Model for monthly time and violation count
    """
    month: str
    violation: int

class HeatmapZipData(BaseModel):
    """
    Model for zipcode and violation count
    """
    zipCode: str
    violation: int

class RatingsData(BaseModel):
    _id: PyObjectId
    area: str
    rating: float
    
class RatingsDataList(BaseModel):
    ratingsData: list[RatingsData]
    
class ScoresData(BaseModel):
    _id: PyObjectId
    dates: list[str]
    scores: list[float]


class IntervalData(BaseModel):
    query: str
    intervals_days: List[int]
    intervals_dates: List[Tuple[str, str]]

class FrequencyItem(BaseModel):
    year: str
    count: int

class FrequencyData(BaseModel):
    query: str
    frequency: List[FrequencyItem]
    total_count: int