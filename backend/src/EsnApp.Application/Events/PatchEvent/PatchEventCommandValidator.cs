using FluentValidation;

namespace EsnApp.Application.Events.PatchEvent;

public class PatchEventCommandValidator : AbstractValidator<PatchEventCommand>
{
    public PatchEventCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
        RuleFor(command => command.Title).NotEmpty().MaximumLength(200)
            .When(command => command.Title is not null);
        RuleFor(command => command.ShortDescription).NotEmpty().MaximumLength(500)
            .When(command => command.ShortDescription is not null);
        RuleFor(command => command.Description).NotEmpty()
            .When(command => command.Description is not null);
        RuleFor(command => command.Location).NotEmpty().MaximumLength(500)
            .When(command => command.Location is not null);
        RuleFor(command => command.ImagePath).MaximumLength(2000)
            .When(command => command.ImagePath is not null);
        RuleFor(command => command.RegistrationUrl)
            .MaximumLength(2000)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("Registration URL must be a valid absolute URL.")
            .When(command => command.RegistrationUrl is not null);
        RuleFor(command => command.Status).IsInEnum()
            .When(command => command.Status.HasValue);
        RuleFor(command => command.MinimumParticipants).GreaterThanOrEqualTo(0)
            .When(command => command.MinimumParticipants.HasValue);
        RuleFor(command => command.MaximumParticipants).GreaterThanOrEqualTo(0)
            .When(command => command.MaximumParticipants.HasValue);
        RuleFor(command => command.CurrentParticipants).GreaterThanOrEqualTo(0)
            .When(command => command.CurrentParticipants.HasValue);
        RuleFor(command => command.Price).GreaterThanOrEqualTo(0)
            .When(command => command.Price.HasValue);
    }
}
