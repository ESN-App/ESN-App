using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using MediatR;

namespace EsnApp.Application.Events.GetAdminEventById;

public record GetAdminEventByIdQuery(Guid Id) : IRequest<Result<EventDetailsDto>>;
