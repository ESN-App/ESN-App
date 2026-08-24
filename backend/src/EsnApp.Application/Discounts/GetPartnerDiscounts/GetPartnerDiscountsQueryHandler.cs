using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetPartnerDiscounts;

public class GetPartnerDiscountsQueryHandler(
    IDiscountRepository discountRepository,
    IPartnerRepository partnerRepository)
    : IRequestHandler<GetPartnerDiscountsQuery, Result<IReadOnlyList<DiscountDto>>>
{
    public async Task<Result<IReadOnlyList<DiscountDto>>> Handle(
        GetPartnerDiscountsQuery request,
        CancellationToken cancellationToken)
    {
        var partner = await partnerRepository.GetAdminByIdAsync(request.PartnerId, cancellationToken);
        if (partner is null)
        {
            return Result.Failure<IReadOnlyList<DiscountDto>>($"Partner '{request.PartnerId}' was not found.");
        }

        var discounts = await discountRepository.GetByPartnerIdAsync(request.PartnerId, cancellationToken);

        return Result.Success<IReadOnlyList<DiscountDto>>(
            discounts.Select(entity => entity.ToDto()).ToList());
    }
}
