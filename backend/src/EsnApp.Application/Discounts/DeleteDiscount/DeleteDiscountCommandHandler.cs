using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using MediatR;

namespace EsnApp.Application.Discounts.DeleteDiscount;

public class DeleteDiscountCommandHandler(IDiscountRepository repository)
    : IRequestHandler<DeleteDiscountCommand, Result>
{
    public async Task<Result> Handle(DeleteDiscountCommand request, CancellationToken cancellationToken)
    {
        var deleted = await repository.DeleteAsync(request.Id, cancellationToken);

        return deleted
            ? Result.Success()
            : Result.Failure($"Discount '{request.Id}' was not found.");
    }
}
