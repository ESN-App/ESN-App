using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetAdminDiscounts;

public class GetAdminDiscountsQueryHandler(IDiscountRepository repository)
    : IRequestHandler<GetAdminDiscountsQuery, Result<IReadOnlyList<DiscountDto>>>
{
    public async Task<Result<IReadOnlyList<DiscountDto>>> Handle(
        GetAdminDiscountsQuery request,
        CancellationToken cancellationToken)
    {
        var discounts = await repository.GetAdminListAsync(cancellationToken);

        return Result.Success<IReadOnlyList<DiscountDto>>(
            discounts.Select(entity => entity.ToDto()).ToList());
    }
}
