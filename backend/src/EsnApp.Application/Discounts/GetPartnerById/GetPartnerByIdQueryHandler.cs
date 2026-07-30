using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetPartnerById;

public class GetPartnerByIdQueryHandler(IPartnerRepository repository)
    : IRequestHandler<GetPartnerByIdQuery, Result<PartnerDto>>
{
    public async Task<Result<PartnerDto>> Handle(
        GetPartnerByIdQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetByIdAsync(request.Id, cancellationToken);

        return entity is null
            ? Result.Failure<PartnerDto>($"Partner '{request.Id}' was not found.")
            : Result.Success(entity.ToDto());
    }
}
