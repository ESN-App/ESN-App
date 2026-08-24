using FluentValidation;

namespace EsnApp.Application.Discounts.UpdatePartner;

public class UpdatePartnerCommandValidator : AbstractValidator<UpdatePartnerCommand>
{
    public UpdatePartnerCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
        RuleFor(command => command.Name).NotEmpty().MaximumLength(200);
        RuleFor(command => command.LogoPath).NotEmpty().MaximumLength(2000);
        RuleFor(command => command.ShortDescription).NotEmpty().MaximumLength(500);
        RuleFor(command => command.Description).NotEmpty();
        RuleFor(command => command.Address).MaximumLength(500);
        RuleFor(command => command.Latitude)
            .InclusiveBetween(-90m, 90m)
            .When(command => command.Latitude.HasValue);
        RuleFor(command => command.Longitude)
            .InclusiveBetween(-180m, 180m)
            .When(command => command.Longitude.HasValue);
        RuleFor(command => command)
            .Must(command => command.Latitude.HasValue == command.Longitude.HasValue)
            .WithMessage("Latitude and longitude must either both be provided or both be omitted.");
    }
}
