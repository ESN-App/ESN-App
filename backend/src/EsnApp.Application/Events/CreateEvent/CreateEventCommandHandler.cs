using EsnApp.Application.Common;
using EsnApp.Application.Events.Abstractions;
using EsnApp.Application.Events.Common;
using EsnApp.Domain.Events;
using MediatR;

namespace EsnApp.Application.Events.CreateEvent;

public class CreateEventCommandHandler(IEventRepository repository)
    : IRequestHandler<CreateEventCommand, Result<EventDetailsDto>>
{
    public async Task<Result<EventDetailsDto>> Handle(
        CreateEventCommand request,
        CancellationToken cancellationToken)
    {
        var entity = new Event
        {
            Title = request.Title,
            ShortDescription = request.ShortDescription,
            Description = request.Description,
            Location = request.Location,
            GoogleMapsUrl = request.GoogleMapsUrl is null ? null : new Uri(request.GoogleMapsUrl),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            StartsAt = request.StartsAt,
            EndsAt = request.EndsAt,
            ImagePath = request.ImagePath,
            RegistrationUrl = request.RegistrationUrl,
            MinimumParticipants = request.MinimumParticipants,
            MaximumParticipants = request.MaximumParticipants,
            CurrentParticipants = request.CurrentParticipants,
            Price = request.Price,
        };

        var created = await repository.AddAsync(entity, cancellationToken);

        return Result.Success(created.ToDetailsDto());
    }
}
