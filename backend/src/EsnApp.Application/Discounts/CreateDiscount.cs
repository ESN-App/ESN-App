using EsnApp.Application.Common;
using EsnApp.Domain.Discounts;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Discounts;

public record CreateDiscountCommand(
    string Title,
    string Description,
    Guid PartnerId) : IRequest<Result<DiscountDto>>;

public class CreateDiscountCommandValidator : AbstractValidator<CreateDiscountCommand>
{
    public CreateDiscountCommandValidator()
    {
        RuleFor(c => c.Title).NotEmpty().MaximumLength(200);
        RuleFor(c => c.PartnerId).NotEmpty();
    }
}

public class CreateDiscountCommandHandler(
    IDiscountRepository discountRepository,
    IPartnerRepository partnerRepository)
    : IRequestHandler<CreateDiscountCommand, Result<DiscountDto>>
{
    public async Task<Result<DiscountDto>> Handle(
        CreateDiscountCommand request,
        CancellationToken cancellationToken)
    {
        var partner = await partnerRepository.GetByIdAsync(request.PartnerId, cancellationToken);

        if (partner is null)
        {
            return Result.Failure<DiscountDto>($"Partner '{request.PartnerId}' was not found.");
        }

        var entity = new Discount
        {
            Title = request.Title,
            Description = request.Description,
            PartnerId = request.PartnerId,
        };

        var created = await discountRepository.AddAsync(entity, cancellationToken);

        return Result.Success(DiscountDto.FromEntity(created));
    }
}
