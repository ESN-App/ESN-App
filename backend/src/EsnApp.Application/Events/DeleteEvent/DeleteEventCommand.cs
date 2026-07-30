using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Events.DeleteEvent;

public record DeleteEventCommand(Guid Id) : IRequest<Result>;
