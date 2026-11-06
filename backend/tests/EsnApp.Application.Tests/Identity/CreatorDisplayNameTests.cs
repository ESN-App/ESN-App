using EsnApp.Application.Identity;

namespace EsnApp.Application.Tests.Identity;

public class CreatorDisplayNameTests
{
    [Theory]
    [InlineData("Jan", "Kowalski", "jan@esn.pl", "Jan K.")]
    [InlineData("  Jan ", "  kowalski", null, "Jan K.")]
    [InlineData("Łucja", "Żak", null, "Łucja Ż.")]
    [InlineData("Jan", "", "jan@esn.pl", "Jan")]
    [InlineData(null, "Kowalski", null, "Kowalski")]
    [InlineData("", " ", "admin@esngdansk.local", "admin")]
    [InlineData(null, null, null, null)]
    [InlineData(null, null, "", null)]
    public void Format_ReturnsShortDisplayName(
        string? firstName, string? lastName, string? email, string? expected) =>
        Assert.Equal(expected, CreatorDisplayName.Format(firstName, lastName, email));
}
