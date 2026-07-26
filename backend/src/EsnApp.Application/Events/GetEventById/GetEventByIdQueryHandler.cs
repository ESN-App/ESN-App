using EsnApp.Application.Common;
using EsnApp.Application.Events.Abstractions;
using EsnApp.Application.Events.Common;
using MediatR;

namespace EsnApp.Application.Events.GetEventById;

public class GetEventByIdQueryHandler(IEventRepository repository)
    : IRequestHandler<GetEventByIdQuery, Result<EventDetailsDto>>
{
    public async Task<Result<EventDetailsDto>> Handle(
        GetEventByIdQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetPublishedByIdAsync(request.Id, cancellationToken);

        return entity is null
            ? Result.Failure<EventDetailsDto>($"Event '{request.Id}' was not found.")
            : Result.Success(entity.ToDetailsDto());
    }
}
