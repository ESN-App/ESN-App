namespace EsnApp.Api.Contracts.Events;

public record CreateEventRequest(
    string Title,
    string ShortDescription,
    string Description,
    string Location,
    string? GoogleMapsUrl,
    decimal? Latitude,
    decimal? Longitude,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    string? ImagePath,
    string? RegistrationUrl,
    int? MinimumParticipants,
    int? MaximumParticipants,
    int? CurrentParticipants,
    decimal Price);
