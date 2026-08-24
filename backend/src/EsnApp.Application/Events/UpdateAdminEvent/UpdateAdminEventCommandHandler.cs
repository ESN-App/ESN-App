using EsnApp.Application.Common;
using EsnApp.Application.Events.Abstractions;
using EsnApp.Application.Events.Common;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Events.UpdateAdminEvent;

public class UpdateAdminEventCommandHandler(IEventRepository repository)
    : IRequestHandler<UpdateAdminEventCommand, Result<EventDetailsDto>>
{
    public async Task<Result<EventDetailsDto>> Handle(
        UpdateAdminEventCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return Result.Failure<EventDetailsDto>($"Event '{request.Id}' was not found.");
        }

        entity.Title = request.Title;
        entity.ShortDescription = request.ShortDescription;
        entity.Description = request.Description;
        entity.Location = request.Location;
        entity.GoogleMapsUrl = request.GoogleMapsUrl is null ? null : new Uri(request.GoogleMapsUrl);
        entity.StartsAt = request.StartsAt;
        entity.EndsAt = request.EndsAt;
        entity.ImagePath = request.ImagePath;
        entity.RegistrationUrl = request.RegistrationUrl;
        entity.MinimumParticipants = request.MinimumParticipants;
        entity.MaximumParticipants = request.MaximumParticipants;
        entity.Price = request.Price;

        if (entity.CurrentParticipants.HasValue
            && entity.MaximumParticipants.HasValue
            && entity.CurrentParticipants > entity.MaximumParticipants)
        {
            throw new ValidationException(
                "Maximum participants cannot be lower than the current participant count.");
        }

        var updated = await repository.UpdateAsync(entity, cancellationToken);
        return Result.Success(updated.ToDetailsDto());
    }
}
