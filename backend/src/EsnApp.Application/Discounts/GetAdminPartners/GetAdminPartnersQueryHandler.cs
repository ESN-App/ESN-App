using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetAdminPartners;

public class GetAdminPartnersQueryHandler(IPartnerRepository repository)
    : IRequestHandler<GetAdminPartnersQuery, Result<IReadOnlyList<AdminPartnerDto>>>
{
    public async Task<Result<IReadOnlyList<AdminPartnerDto>>> Handle(
        GetAdminPartnersQuery request,
        CancellationToken cancellationToken)
    {
        var partners = await repository.GetAdminListAsync(request.Status, cancellationToken);

        return Result.Success<IReadOnlyList<AdminPartnerDto>>(
            partners.Select(entity => entity.ToAdminDto()).ToList());
    }
}
