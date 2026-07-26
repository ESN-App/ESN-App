using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using EsnApp.Domain.Events;
using MediatR;

namespace EsnApp.Application.Events.PatchEvent;

public record PatchEventCommand(
    Guid Id,
    string? Title,
    string? ShortDescription,
    string? Description,
    string? Location,
    DateTimeOffset? StartsAt,
    DateTimeOffset? EndsAt,
    string? ImagePath,
    string? RegistrationUrl,
    EventStatus? Status,
    int? MinimumParticipants,
    int? MaximumParticipants,
    int? CurrentParticipants,
    decimal? Price) : IRequest<Result<EventDetailsDto>>;
