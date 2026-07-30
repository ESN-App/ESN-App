using FluentValidation;

namespace EsnApp.Application.Discounts.ReorderPartners;

public class ReorderPartnersCommandValidator : AbstractValidator<ReorderPartnersCommand>
{
    public ReorderPartnersCommandValidator()
    {
        RuleFor(command => command.PartnerIds)
            .NotEmpty()
            .Must(ids => ids.Distinct().Count() == ids.Count)
            .WithMessage("PartnerIds cannot contain duplicates.");

        RuleForEach(command => command.PartnerIds).NotEmpty();
    }
}
