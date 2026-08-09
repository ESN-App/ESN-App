using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using EsnApp.Domain.Events;
using MediatR;

namespace EsnApp.Application.Events.UpdateEventStatus;

public record UpdateEventStatusCommand(Guid Id, EventStatus Status)
    : IRequest<Result<EventDetailsDto>>;
