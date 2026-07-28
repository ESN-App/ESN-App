using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using EsnApp.Domain.Discounts;
using MediatR;

namespace EsnApp.Application.Discounts.CreateDiscount;

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

        return Result.Success(created.ToDto());
    }
}
