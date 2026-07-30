using FluentValidation;

namespace EsnApp.Application.Discounts.CreateDiscount;

public class CreateDiscountCommandValidator : AbstractValidator<CreateDiscountCommand>
{
    public CreateDiscountCommandValidator()
    {
        RuleFor(command => command.Title).NotEmpty().MaximumLength(200);
        RuleFor(command => command.PartnerId).NotEmpty();
    }
}
