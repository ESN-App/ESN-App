using FluentValidation;

namespace EsnApp.Application.Discounts.UpdatePartnerStatus;

public class UpdatePartnerStatusCommandValidator : AbstractValidator<UpdatePartnerStatusCommand>
{
    public UpdatePartnerStatusCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
        RuleFor(command => command.Status).IsInEnum();
    }
}
