using EsnApp.Application.Common;
using EsnApp.Application.Events.Abstractions;
using MediatR;

namespace EsnApp.Application.Events.DeleteEvent;

public class DeleteEventCommandHandler(IEventRepository repository)
    : IRequestHandler<DeleteEventCommand, Result>
{
    public async Task<Result> Handle(
        DeleteEventCommand request,
        CancellationToken cancellationToken)
    {
        var deleted = await repository.DeleteAsync(request.Id, cancellationToken);

        return deleted
            ? Result.Success()
            : Result.Failure($"Event '{request.Id}' was not found.");
    }
}
