using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using MediatR;

namespace EsnApp.Application.Events.GetEventById;

public record GetEventByIdQuery(Guid Id) : IRequest<Result<EventDetailsDto>>;
