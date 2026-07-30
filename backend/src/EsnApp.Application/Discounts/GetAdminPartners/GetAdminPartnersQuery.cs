using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using EsnApp.Domain.Discounts;
using MediatR;

namespace EsnApp.Application.Discounts.GetAdminPartners;

public record GetAdminPartnersQuery(PartnerStatus? Status)
    : IRequest<Result<IReadOnlyList<PartnerDto>>>;
