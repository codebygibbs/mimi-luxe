from pydantic import BaseModel, EmailStr, Field

class AdminCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str 

class AdminResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    class Config:
        from_attribute = True


class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


class AdminForgotPasswordRequest(BaseModel):
    email: EmailStr


class AdminResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(
        min_length=8,
        max_length=128
    )