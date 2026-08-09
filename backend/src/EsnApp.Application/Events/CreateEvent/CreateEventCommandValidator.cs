using FluentValidation;

namespace EsnApp.Application.Events.CreateEvent;

public class CreateEventCommandValidator : AbstractValidator<CreateEventCommand>
{
    public CreateEventCommandValidator()
    {
        RuleFor(command => command.Title).NotEmpty().MaximumLength(200);
        RuleFor(command => command.ShortDescription).NotEmpty().MaximumLength(200);
        RuleFor(command => command.Description).NotEmpty().MaximumLength(5000);
        RuleFor(command => command.Location).NotEmpty().MaximumLength(500);
        RuleFor(command => command.GoogleMapsUrl)
            .MaximumLength(2000)
            .Must(url => url is null || Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("Google Maps URL must be a valid absolute URL.");
        RuleFor(command => command.StartsAt).NotEmpty();
        RuleFor(command => command.EndsAt)
            .GreaterThan(command => command.StartsAt)
            .When(command => command.EndsAt.HasValue);
        RuleFor(command => command.ImagePath).MaximumLength(2000);
        RuleFor(command => command.RegistrationUrl)
            .MaximumLength(2000)
            .Must(url => url is null || Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("Registration URL must be a valid absolute URL.");
        RuleFor(command => command.MinimumParticipants).GreaterThanOrEqualTo(0);
        RuleFor(command => command.MaximumParticipants).GreaterThanOrEqualTo(0);
        RuleFor(command => command.CurrentParticipants).GreaterThanOrEqualTo(0);
        RuleFor(command => command.MaximumParticipants)
            .GreaterThanOrEqualTo(command => command.MinimumParticipants)
            .When(command => command.MinimumParticipants.HasValue && command.MaximumParticipants.HasValue);
        RuleFor(command => command.CurrentParticipants)
            .LessThanOrEqualTo(command => command.MaximumParticipants)
            .When(command => command.CurrentParticipants.HasValue && command.MaximumParticipants.HasValue);
        RuleFor(command => command.Price).GreaterThanOrEqualTo(0);
    }
}
