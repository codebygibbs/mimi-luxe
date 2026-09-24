from pydantic import BaseModel, Field, EmailStr

class CustomerCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=150)
    phone: str | None = None
    password: str = Field(min_length=6, max_length=100)

class CustomerLogin(BaseModel):
    email: str = Field(min_length=5, max_length=150)
    password: str = Field(min_length=6, max_length=100)


class CustomerResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str | None = None

    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(
        min_length=20
    )

    new_password: str = Field(
        min_length=8,
        max_length=128
    )

