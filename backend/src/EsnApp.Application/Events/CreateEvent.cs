using EsnApp.Application.Common;
using EsnApp.Domain.Events;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Events;

public record CreateEventCommand(
    string Title,
    string Description,
    string Location,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt) : IRequest<Result<EventDto>>;

public class CreateEventCommandValidator : AbstractValidator<CreateEventCommand>
{
    public CreateEventCommandValidator()
    {
        RuleFor(c => c.Title).NotEmpty().MaximumLength(200);
        RuleFor(c => c.Location).MaximumLength(500);
        RuleFor(c => c.StartsAt).NotEmpty();
    }
}

public class CreateEventCommandHandler(IEventRepository repository)
    : IRequestHandler<CreateEventCommand, Result<EventDto>>
{
    public async Task<Result<EventDto>> Handle(
        CreateEventCommand request,
        CancellationToken cancellationToken)
    {
        var entity = new Event
        {
            Title = request.Title,
            Description = request.Description,
            Location = request.Location,
            StartsAt = request.StartsAt,
            EndsAt = request.EndsAt,
        };

        var created = await repository.AddAsync(entity, cancellationToken);

        return Result.Success(EventDto.FromEntity(created));
    }
}
