using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Discounts;

public record GetDiscountByIdQuery(Guid Id) : IRequest<Result<DiscountDto>>;

public class GetDiscountByIdQueryHandler(IDiscountRepository repository)
    : IRequestHandler<GetDiscountByIdQuery, Result<DiscountDto>>
{
    public async Task<Result<DiscountDto>> Handle(
        GetDiscountByIdQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetByIdAsync(request.Id, cancellationToken);

        return entity is null
            ? Result.Failure<DiscountDto>($"Discount '{request.Id}' was not found.")
            : Result.Success(DiscountDto.FromEntity(entity));
    }
}
