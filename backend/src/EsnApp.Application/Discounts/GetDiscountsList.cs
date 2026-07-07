using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Discounts;

public record GetDiscountsListQuery : IRequest<Result<IReadOnlyList<DiscountDto>>>;

public class GetDiscountsListQueryHandler(IDiscountRepository repository)
    : IRequestHandler<GetDiscountsListQuery, Result<IReadOnlyList<DiscountDto>>>
{
    public async Task<Result<IReadOnlyList<DiscountDto>>> Handle(
        GetDiscountsListQuery request,
        CancellationToken cancellationToken)
    {
        var discounts = await repository.GetAllAsync(cancellationToken);

        return Result.Success<IReadOnlyList<DiscountDto>>(
            discounts.Select(DiscountDto.FromEntity).ToList());
    }
}
