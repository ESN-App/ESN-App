using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetPartnersList;

public class GetPartnersListQueryHandler(IPartnerRepository repository)
    : IRequestHandler<GetPartnersListQuery, Result<IReadOnlyList<PartnerDto>>>
{
    public async Task<Result<IReadOnlyList<PartnerDto>>> Handle(
        GetPartnersListQuery request,
        CancellationToken cancellationToken)
    {
        var partners = await repository.GetAllAsync(cancellationToken);

        return Result.Success<IReadOnlyList<PartnerDto>>(
            partners.Select(entity => entity.ToDto()).ToList());
    }
}
