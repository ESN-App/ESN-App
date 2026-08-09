using FluentValidation;

namespace EsnApp.Application.Events.UpdateEventStatus;

public class UpdateEventStatusCommandValidator : AbstractValidator<UpdateEventStatusCommand>
{
    public UpdateEventStatusCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
        RuleFor(command => command.Status).IsInEnum();
    }
}
