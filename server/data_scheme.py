from typing import Optional, List, Annotated
from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator
from bson import ObjectId

# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.

PyObjectId = Annotated[str, BeforeValidator(str)]

class RestaurantInfo(BaseModel):
    """
    Model for Restaurant Info
    """
    _id: PyObjectId
    owner: str
    facilityName: str
    address: str
    category: str
    
class InspectionInfo(BaseModel):
    """
    Model for Inspection Info
    """
    _id: PyObjectId
    date: str
    owner: str
    facilityName: str
    name: str
    address: str
    category: str
    service: str
    score: float
    grade: str
    violationStatuses: list[str]
    violations: list[str]
    points: list[float]
    
class QueryList(BaseModel):
    """
    Model for possible search queries
    """
    _id: PyObjectId
    addresses: list[str]