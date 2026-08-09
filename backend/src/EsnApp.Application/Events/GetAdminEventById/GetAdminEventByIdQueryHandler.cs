using EsnApp.Application.Common;
using EsnApp.Application.Events.Abstractions;
using EsnApp.Application.Events.Common;
using MediatR;

namespace EsnApp.Application.Events.GetAdminEventById;

public class GetAdminEventByIdQueryHandler(IEventRepository repository)
    : IRequestHandler<GetAdminEventByIdQuery, Result<EventDetailsDto>>
{
    public async Task<Result<EventDetailsDto>> Handle(
        GetAdminEventByIdQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetByIdAsync(request.Id, cancellationToken);

        return entity is null
            ? Result.Failure<EventDetailsDto>($"Event '{request.Id}' was not found.")
            : Result.Success(entity.ToDetailsDto());
    }
}
