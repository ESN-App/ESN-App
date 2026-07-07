using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Events;

public record GetEventsListQuery : IRequest<Result<IReadOnlyList<EventDto>>>;

public class GetEventsListQueryHandler(IEventRepository repository)
    : IRequestHandler<GetEventsListQuery, Result<IReadOnlyList<EventDto>>>
{
    public async Task<Result<IReadOnlyList<EventDto>>> Handle(
        GetEventsListQuery request,
        CancellationToken cancellationToken)
    {
        var events = await repository.GetAllAsync(cancellationToken);

        return Result.Success<IReadOnlyList<EventDto>>(
            events.Select(EventDto.FromEntity).ToList());
    }
}
