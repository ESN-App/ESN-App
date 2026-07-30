using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using EsnApp.Domain.Discounts;
using MediatR;

namespace EsnApp.Application.Discounts.ReorderPartners;

public class ReorderPartnersCommandHandler(IPartnerRepository repository)
    : IRequestHandler<ReorderPartnersCommand, Result<IReadOnlyList<PartnerDto>>>
{
    public async Task<Result<IReadOnlyList<PartnerDto>>> Handle(
        ReorderPartnersCommand request,
        CancellationToken cancellationToken)
    {
        var activePartners = await repository.GetAdminListAsync(
            PartnerStatus.Active,
            cancellationToken);

        var requestedIds = request.PartnerIds.ToHashSet();
        var activeIds = activePartners.Select(partner => partner.Id).ToHashSet();

        if (requestedIds.Count != activeIds.Count || !requestedIds.SetEquals(activeIds))
        {
            return Result.Failure<IReadOnlyList<PartnerDto>>(
                "PartnerIds must contain every active partner exactly once.");
        }

        var partnersById = activePartners.ToDictionary(partner => partner.Id);

        for (var index = 0; index < request.PartnerIds.Count; index++)
        {
            partnersById[request.PartnerIds[index]].DisplayOrder = index;
        }

        await repository.UpdateRangeAsync(activePartners, cancellationToken);

        return Result.Success<IReadOnlyList<PartnerDto>>(
            request.PartnerIds
                .Select(id => partnersById[id].ToDto())
                .ToList());
    }
}
