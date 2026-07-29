using EsnApp.Application.Common;
using EsnApp.Application.Events.Abstractions;
using EsnApp.Application.Events.Common;
using EsnApp.Domain.Events;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Events.PatchEvent;

public class PatchEventCommandHandler(IEventRepository repository)
    : IRequestHandler<PatchEventCommand, Result<EventDetailsDto>>
{
    public async Task<Result<EventDetailsDto>> Handle(
        PatchEventCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetByIdAsync(request.Id, cancellationToken);

        if (entity is null)
        {
            return Result.Failure<EventDetailsDto>($"Event '{request.Id}' was not found.");
        }

        entity.Title = request.Title ?? entity.Title;
        entity.ShortDescription = request.ShortDescription ?? entity.ShortDescription;
        entity.Description = request.Description ?? entity.Description;
        entity.Location = request.Location ?? entity.Location;
        entity.GoogleMapsUrl = request.GoogleMapsUrl is null ? entity.GoogleMapsUrl : new Uri(request.GoogleMapsUrl);
        entity.Latitude = request.Latitude ?? entity.Latitude;
        entity.Longitude = request.Longitude ?? entity.Longitude;
        entity.StartsAt = request.StartsAt ?? entity.StartsAt;
        entity.EndsAt = request.EndsAt ?? entity.EndsAt;
        entity.ImagePath = request.ImagePath ?? entity.ImagePath;
        entity.RegistrationUrl = request.RegistrationUrl ?? entity.RegistrationUrl;
        entity.Status = request.Status ?? entity.Status;
        entity.MinimumParticipants = request.MinimumParticipants ?? entity.MinimumParticipants;
        entity.MaximumParticipants = request.MaximumParticipants ?? entity.MaximumParticipants;
        entity.CurrentParticipants = request.CurrentParticipants ?? entity.CurrentParticipants;
        entity.Price = request.Price ?? entity.Price;

        if (entity.EndsAt.HasValue && entity.EndsAt <= entity.StartsAt)
        {
            throw new ValidationException("End date must be later than start date.");
        }

        if (entity.MinimumParticipants.HasValue
            && entity.MaximumParticipants.HasValue
            && entity.MaximumParticipants < entity.MinimumParticipants)
        {
            throw new ValidationException(
                "Maximum participants must be greater than or equal to minimum participants.");
        }

        if (entity.CurrentParticipants.HasValue
            && entity.MaximumParticipants.HasValue
            && entity.CurrentParticipants > entity.MaximumParticipants)
        {
            throw new ValidationException(
                "Current participants must be less than or equal to maximum participants.");
        }

        if (request.Status == EventStatus.Published && entity.PublishedAt is null)
        {
            entity.PublishedAt = DateTimeOffset.UtcNow;
        }

        var updated = await repository.UpdateAsync(entity, cancellationToken);

        return Result.Success(updated.ToDetailsDto());
    }
}
