using EsnApp.Application.Common;
using EsnApp.Application.Events.Abstractions;
using EsnApp.Application.Events.Common;
using EsnApp.Domain.Events;
using MediatR;

namespace EsnApp.Application.Events.UpdateEventStatus;

public class UpdateEventStatusCommandHandler(IEventRepository repository)
    : IRequestHandler<UpdateEventStatusCommand, Result<AdminEventDetailsDto>>
{
    public async Task<Result<AdminEventDetailsDto>> Handle(
        UpdateEventStatusCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return Result.Failure<AdminEventDetailsDto>($"Event '{request.Id}' was not found.");
        }

        entity.Status = request.Status;
        if (request.Status == EventStatus.Published && entity.PublishedAt is null)
        {
            entity.PublishedAt = DateTimeOffset.UtcNow;
        }

        var updated = await repository.UpdateAsync(entity, cancellationToken);
        return Result.Success(updated.ToAdminDto());
    }
}
