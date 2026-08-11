using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.UpdateDiscount;

public class UpdateDiscountCommandHandler(IDiscountRepository repository)
    : IRequestHandler<UpdateDiscountCommand, Result<DiscountDto>>
{
    public async Task<Result<DiscountDto>> Handle(
        UpdateDiscountCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return Result.Failure<DiscountDto>($"Discount '{request.Id}' was not found.");
        }

        entity.Title = request.Title;
        entity.Description = request.Description;
        entity.Partner = null;

        var updated = await repository.UpdateAsync(entity, cancellationToken);
        return Result.Success(updated.ToDto());
    }
}
