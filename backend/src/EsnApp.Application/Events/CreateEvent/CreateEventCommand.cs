using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using MediatR;

namespace EsnApp.Application.Events.CreateEvent;

public record CreateEventCommand(
    string Title,
    string ShortDescription,
    string Description,
    string Location,
    string? GoogleMapsUrl,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    string? ImagePath,
    string? RegistrationUrl,
    int? MinimumParticipants,
    int? MaximumParticipants,
    int? CurrentParticipants,
    decimal Price) : IRequest<Result<EventDetailsDto>>;
