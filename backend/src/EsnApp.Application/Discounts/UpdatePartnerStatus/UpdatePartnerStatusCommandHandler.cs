using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using EsnApp.Domain.Discounts;
using MediatR;

namespace EsnApp.Application.Discounts.UpdatePartnerStatus;

public class UpdatePartnerStatusCommandHandler(IPartnerRepository repository)
    : IRequestHandler<UpdatePartnerStatusCommand, Result<PartnerDto>>
{
    public async Task<Result<PartnerDto>> Handle(
        UpdatePartnerStatusCommand request,
        CancellationToken cancellationToken)
    {
        var partner = await repository.GetAdminByIdAsync(request.Id, cancellationToken);

        if (partner is null)
        {
            return Result.Failure<PartnerDto>($"Partner '{request.Id}' was not found.");
        }

        if (partner.Status != PartnerStatus.Active && request.Status == PartnerStatus.Active)
        {
            var activePartners = await repository.GetAdminListAsync(
                PartnerStatus.Active,
                cancellationToken);

            partner.DisplayOrder = activePartners.Count == 0
                ? 0
                : activePartners.Max(activePartner => activePartner.DisplayOrder) + 1;
        }

        partner.Status = request.Status;
        var updated = await repository.UpdateAsync(partner, cancellationToken);

        return Result.Success(updated.ToDto());
    }
}
