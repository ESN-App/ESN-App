using EsnApp.Application.Identity;

namespace EsnApp.Application.Tests.Identity;

public class CreateAdminRequestValidatorTests
{
    private readonly CreateAdminRequestValidator _validator = new();

    [Fact]
    public void Validate_CompleteRequest_IsValid() =>
        Assert.True(_validator.Validate(Request("Jan", "Kowalski")).IsValid);

    [Fact]
    public void Validate_NamesWithSurroundingWhitespace_CountOnlyTrimmedLength() =>
        Assert.True(_validator.Validate(Request($"  {new string('a', 50)}  ", "Kowalski")).IsValid);

    [Theory]
    [InlineData("", "Kowalski", "FirstName")]
    [InlineData("   ", "Kowalski", "FirstName")]
    [InlineData("Jan", "", "LastName")]
    [InlineData("Jan", "   ", "LastName")]
    public void Validate_MissingName_Fails(string firstName, string lastName, string property)
    {
        var result = _validator.Validate(Request(firstName, lastName));

        Assert.Contains(result.Errors, error => error.PropertyName == property);
    }

    [Fact]
    public void Validate_TooLongNames_Fail()
    {
        var tooLong = new string('a', 51);

        var result = _validator.Validate(Request(tooLong, tooLong));

        Assert.Contains(result.Errors, error => error.PropertyName == "FirstName");
        Assert.Contains(result.Errors, error => error.PropertyName == "LastName");
    }

    private static CreateAdminRequest Request(string firstName, string lastName) =>
        new("jan@esngdansk.pl", "Password1", firstName, lastName);
}
