using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using MediatR;

namespace EsnApp.Application.Events.UpdateAdminEvent;

public record UpdateAdminEventCommand(
    Guid Id,
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
    decimal Price) : IRequest<Result<EventDetailsDto>>;
