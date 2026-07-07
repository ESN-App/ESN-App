using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Events;

public record GetEventByIdQuery(Guid Id) : IRequest<Result<EventDto>>;

public class GetEventByIdQueryHandler(IEventRepository repository)
    : IRequestHandler<GetEventByIdQuery, Result<EventDto>>
{
    public async Task<Result<EventDto>> Handle(
        GetEventByIdQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetByIdAsync(request.Id, cancellationToken);

        return entity is null
            ? Result.Failure<EventDto>($"Event '{request.Id}' was not found.")
            : Result.Success(EventDto.FromEntity(entity));
    }
}
