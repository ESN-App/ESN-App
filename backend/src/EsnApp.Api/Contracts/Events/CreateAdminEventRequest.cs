using Microsoft.AspNetCore.Http;

namespace EsnApp.Api.Contracts.Events;

public class CreateAdminEventRequest
{
    public required string Title { get; init; }
    public required string ShortDescription { get; init; }
    public required string Description { get; init; }
    public required string Location { get; init; }
    public string? GoogleMapsUrl { get; init; }
    public DateTimeOffset StartsAt { get; init; }
    public DateTimeOffset? EndsAt { get; init; }
    public IFormFile? Image { get; init; }
    public string? RegistrationUrl { get; init; }
    public int? MinimumParticipants { get; init; }
    public int? MaximumParticipants { get; init; }
    public decimal Price { get; init; }
}

public class UpdateAdminEventRequest : CreateAdminEventRequest
{
    public bool RemoveImage { get; init; }
}
