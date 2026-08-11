using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.UpdatePartner;

public class UpdatePartnerCommandHandler(IPartnerRepository repository)
    : IRequestHandler<UpdatePartnerCommand, Result<PartnerDto>>
{
    public async Task<Result<PartnerDto>> Handle(
        UpdatePartnerCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetAdminByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return Result.Failure<PartnerDto>($"Partner '{request.Id}' was not found.");
        }

        entity.Name = request.Name;
        entity.LogoPath = request.LogoPath;
        entity.ShortDescription = request.ShortDescription;
        entity.Description = request.Description;
        entity.Address = request.Address;
        entity.WebsiteUrl = request.WebsiteUrl;
        entity.GoogleMapsUrl = request.GoogleMapsUrl;
        entity.Latitude = request.Latitude;
        entity.Longitude = request.Longitude;

        if (request.displayOrder.HasValue)
        {
          entity.DisplayOrder = request.displayOrder.Value;
        }

        var updated = await repository.UpdateAsync(entity, cancellationToken);
        return Result.Success(updated.ToDto());
    }
}
