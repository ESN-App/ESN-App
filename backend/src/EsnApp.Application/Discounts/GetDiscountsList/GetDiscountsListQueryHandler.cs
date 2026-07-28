using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetDiscountsList;

public class GetDiscountsListQueryHandler(IDiscountRepository repository)
    : IRequestHandler<GetDiscountsListQuery, Result<IReadOnlyList<DiscountDto>>>
{
    public async Task<Result<IReadOnlyList<DiscountDto>>> Handle(
        GetDiscountsListQuery request,
        CancellationToken cancellationToken)
    {
        var discounts = await repository.GetAllAsync(cancellationToken);

        return Result.Success<IReadOnlyList<DiscountDto>>(
            discounts.Select(entity => entity.ToDto()).ToList());
    }
}
